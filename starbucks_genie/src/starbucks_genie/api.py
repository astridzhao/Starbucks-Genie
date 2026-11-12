"""Asynchronous drink creation API. Jobs live in one worker process."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import json
import logging
import os
from uuid import uuid4

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import BadRequest, UnsupportedMediaType

from .job_manager import Event, JobManager

load_dotenv()
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16384
CORS(app, origins=os.getenv(
    'CORS_ORIGINS', 'http://localhost:3000,https://starbucks-genie.vercel.app'
).split(','))
executor = ThreadPoolExecutor(max_workers=2)
job_manager = JobManager()


def create_crew(job_id):
    # Defer AI initialization until a job starts, keeping health checks lightweight.
    from .crew import drinkCreateCrew
    return drinkCreateCrew(job_id, job_manager)


def kickoff_crew(job_id, user_preference, user_input):
    try:
        job_manager.append_event(job_id, 'Starting drink creation...')
        crew = create_crew(job_id)
        crew.setup_crew(user_preference, user_input)
        result = crew.kickoff()
        result = result.json_dict if hasattr(result, 'json_dict') else result
        if isinstance(result, str):
            result = json.loads(result)
        if (not isinstance(result, dict)
                or not isinstance(result.get('name'), str) or not result['name'].strip()
                or not isinstance(result.get('ingredient'), list)
                or not result['ingredient']
                or not all(isinstance(item, str) for item in result['ingredient'])
                or not isinstance(result.get('recommendation'), str)):
            raise ValueError('Drink generation returned an invalid recipe')
        with job_manager.lock:
            job = job_manager.jobs.get(job_id)
            if job:
                job.status = 'SUCCESS'
                job.result = result
                job.events.append(Event(datetime.now(), 'Your drink is ready'))
    except Exception:
        logging.exception('Drink creation failed for %s', job_id)
        with job_manager.lock:
            job = job_manager.jobs.get(job_id)
            if job:
                job.status = 'ERROR'
                job.result = None
                job.events.append(Event(datetime.now(), 'Drink creation failed. Please try again.'))


@app.get('/')
@app.get('/api/health')
def health():
    return jsonify({'status': 'ok', 'ai_configured': bool(os.getenv('OPENAI_API_KEY'))})


@app.post('/api/drink')
def run_crew():
    try:
        data = request.get_json()
    except (BadRequest, UnsupportedMediaType):
        return jsonify({'message': 'Send a valid JSON object'}), 400
    if not isinstance(data, dict):
        return jsonify({'message': 'Send a valid JSON object'}), 400
    user_preference = data.get('user-preference', [])
    user_input = data.get('user-input', [])
    for items in (user_preference, user_input):
        if (not isinstance(items, list) or len(items) > 20
                or any(not isinstance(item, str) or len(item) > 500 for item in items)):
            return jsonify({'message': 'Inputs must be lists of up to 20 strings, each at most 500 characters'}), 400
    if not os.getenv('OPENAI_API_KEY'):
        return jsonify({'message': 'Drink generation is not configured. Set OPENAI_API_KEY on the server.'}), 503
    if not user_preference and not user_input:
        user_input = ['Surprise me with something creative and unique']
        user_preference = ["I'm open to trying new flavors"]
    job_manager.cleanup_old_jobs()
    job_id = str(uuid4())
    job_manager.append_event(job_id, 'Job initialized')
    try:
        executor.submit(kickoff_crew, job_id, user_preference, user_input)
    except RuntimeError:
        with job_manager.lock:
            job_manager.jobs.pop(job_id, None)
        return jsonify({'message': 'Drink generation is unavailable. Please try again.'}), 503
    return jsonify({'job_id': job_id}), 202


@app.get('/api/drink/<job_id>')
def get_status(job_id):
    with job_manager.lock:
        job = job_manager.jobs.get(job_id)
        if not job:
            return jsonify({'status': 'NOT_FOUND', 'message': 'Job not found'}), 404
        return jsonify({
            'job_id': job_id,
            'status': job.status,
            'result': job.result,
            'events': [{'timestamp': event.timestamp.isoformat(), 'data': event.data}
                       for event in job.events],
        })


if __name__ == '__main__':
    app.run(port=int(os.getenv('PORT', '3001')))
