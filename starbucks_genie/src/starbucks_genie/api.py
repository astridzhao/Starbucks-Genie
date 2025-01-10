from datetime import datetime
import json
from threading import Thread
from uuid import uuid4
from flask import Flask, abort, jsonify, request
from crew import drinkCreateCrew
from job_manager import Event, append_event, jobs_lock, jobs
from dotenv import load_dotenv
from flask_cors import CORS
import os
from litellm import LiteLLM

# Load environment variables from .env file
load_dotenv()
# Get the API key from the environment variable
api_key = os.getenv('OPENAI_API_KEY')

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
def kickoff_crew(job_id, user_preference, user_input):
    print(f'run job {job_id} for {user_input, user_preference}')
    result = None
    #SET UP CREWS
    try:
        append_event(job_id, "Starting drink creation...")
        crew = drinkCreateCrew(job_id)
        crew.setup_crew(user_preference, user_input)
        append_event(job_id, "Crew setup completed")
        
        #RUN CREWS
        result = crew.kickoff()
        append_event(job_id, f"Drink creation completed: {result.name if hasattr(result, 'name') else result}")
    except Exception as e:
        print(f"Crew failed for job {job_id}")
        append_event(job_id, f"Error: {str(e)}")
        with jobs_lock:
            jobs[job_id].status = "ERROR"
            jobs[job_id].result = str(e)
    
    with jobs_lock:
        jobs[job_id].status = "SUCCESS"
        jobs[job_id].result = result.json_dict if hasattr(result, 'json_dict') else result
        jobs[job_id].events.append(Event(
            data="Process completed successfully",
            timestamp=datetime.now()
        ))

@app.route('/api/drink', methods=['POST'])
def run_crew():
    data = request.json
    
    # Set default values for empty inputs
    user_preference = data.get('user-preference', [])
    user_input = data.get('user-input', [])
    
    # If both are empty, use default inspiration mode
    if not user_preference and not user_input:
        user_input = ["Surprise me with something creative and unique"]
        user_preference = ["I'm open to trying new flavors"]
    
    job_id = str(uuid4())
    
    thread = Thread(target=kickoff_crew, args=(job_id, user_preference, user_input))
    thread.start()
    return jsonify({'job_id': job_id}), 200

@app.route('/api/drink/<job_id>', methods=['GET'])
def get_status(job_id):
    # Lock the job
    with jobs_lock:
        job = jobs.get(job_id)
        print("Job status is: ", job.status)
        print("Job result is: ", job.result)
        # Check if job exist
        if not job:
            abort(404, description="Job not found")
    
    try:
        result_json = json.loads(job.result)
    except:
        result_json = job.result 

    print("Final Result: ", result_json)
    return jsonify({
        'job_id': job_id,
        'status': job.status,
        'result': result_json,
        'events': [
            {'timestamp': event.timestamp.isoformat(),
            'data': event.data} for event in job.events]
    }), 200

if __name__== '__main__':
    app.run(debug=True, port=3001)