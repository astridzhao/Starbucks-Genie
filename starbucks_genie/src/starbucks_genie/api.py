from datetime import datetime
import json
from threading import Thread, Lock
from uuid import uuid4
from flask import Flask, abort, jsonify, request
from .crew import drinkCreateCrew
# from job_manager import Event, append_event, jobs_lock, jobs
from .job_manager import Event, JobManager
from concurrent.futures import ThreadPoolExecutor
import queue
from dotenv import load_dotenv
from flask_cors import CORS
import os
import logging

logging.basicConfig(level=logging.INFO) 

# Load environment variables from .env file
load_dotenv()
# Get the API key from the environment variable
api_key = os.getenv('OPENAI_API_KEY')

app = Flask(__name__)

# CORS(app, 
#      origins=["http://localhost:3000", "https://starbucks-genie.vercel.app"],
#      allow_headers=["Content-Type"],
#      supports_credentials=True,
#      methods=["GET", "POST", "OPTIONS"])

# Create a thread pool to manage concurrent requests
executor = ThreadPoolExecutor(max_workers=1)  # Limit concurrent jobs
job_queue = queue.Queue()

# Initialize job manager
job_manager = JobManager()

def kickoff_crew(job_id, user_preference, user_input):
    try:
        with job_manager.lock:  # Use job_manager's lock
            if job_id not in job_manager.jobs:
                print(f"Job {job_id} was cancelled or doesn't exist")
                return
            
        print(f'run job {job_id} for {user_input, user_preference}')
        result = None
        
        try:
            #Set up Crew
            job_manager.append_event(job_id, "Starting drink creation...")
            crew = drinkCreateCrew(job_id)
            crew.setup_crew(user_preference, user_input)
            job_manager.append_event(job_id, "Crew setup completed")
            
            #Run Crew
            result = crew.kickoff()
            job_manager.append_event(job_id, f"Drink creation completed: {result.name if hasattr(result, 'name') else result}")
        except Exception as e:
            print(f"Crew failed for job {job_id}")
            job_manager.append_event(job_id, f"Error: {str(e)}")
            with job_manager.lock:
                job_manager.jobs[job_id].status = "ERROR"
                job_manager.jobs[job_id].result = str(e)
            return
        
        with job_manager.lock:
            if job_id in job_manager.jobs:  # Check if job still exists
                job_manager.jobs[job_id].status = "SUCCESS"
                job_manager.jobs[job_id].result = result.json_dict if hasattr(result, 'json_dict') else result
                job_manager.jobs[job_id].events.append(Event(
                    data="Process completed successfully",
                    timestamp=datetime.now()
                ))
    except Exception as e:
        print(f"Unexpected error in job {job_id}: {str(e)}")

@app.route('/api/drink', methods=['OPTIONS'])
@app.route('/api/drink/<job_id>', methods=['OPTIONS'])
def handle_options(job_id=None):
    response = jsonify({'message': 'CORS preflight successful'})
    response.status_code = 204
    return response

@app.route('/api/drink', methods=['POST'])
def run_crew():
    try:
        data = request.json
        user_preference = data.get('user-preference', [])
        user_input = data.get('user-input', [])
        
        if not user_preference and not user_input:
            user_input = ["Surprise me with something creative and unique"]
            user_preference = ["I'm open to trying new flavors"]
        
        job_id = str(uuid4())
        
        # Check if the job already exists
        with job_manager.lock:
            if job_id in job_manager.jobs:
                return jsonify({'status': 'ERROR', 'message': 'Job already exists'}), 400
        
        # Initialize the job before submitting to thread pool
        job_manager.append_event(job_id, "Job initialized")
        
        # Submit job to thread pool
        executor.submit(kickoff_crew, job_id, user_preference, user_input)
        return jsonify({'job_id': job_id}), 200
    except Exception as e:
        print(f"Error in run_crew: {str(e)}")
        return jsonify({
            'status': 'ERROR',
            'message': str(e)
        }), 500

@app.route('/api/drink/<job_id>', methods=['GET'])
def get_status(job_id):
    try:
        # Lock the job
        with job_manager.lock:
            job = job_manager.jobs.get(job_id)
            if not job:
                logging.error(f"Job not found: {job_id}")
                logging.error(f"Available jobs: {list(job_manager.jobs.keys())}")
                return jsonify({
                    'status': 'NOT_FOUND',
                    'message': 'Job not found',
                    'debug_info': {
                        'timestamp': datetime.now().isoformat(),
                        'available_jobs': list(job_manager.jobs.keys())
                    }
                }), 404
            
            # print("Job found:", job_id)
            # print("Job status:", job.status)
            # print("Job result:", job.result)
            logging.info("Job found: %s", job_id)
            logging.info("Job status: %s", job.status)
            logging.info("Job result: %s", job.result)
        
            try:
                result_json = json.loads(job.result) if job.result else None
            except:
                result_json = job.result 

            return jsonify({
                'job_id': job_id,
                'status': job.status,
                'result': result_json,
                'events': [
                    {'timestamp': event.timestamp.isoformat(),
                     'data': event.data} for event in job.events
                ]
            }), 200
    except Exception as e:
        print(f"Error in get_status: {str(e)}")
        return jsonify({
            'status': 'ERROR',
            'message': str(e)
        }), 500

if __name__== '__main__':
    app.run(debug=True, port=os.getenv("PORT", default=3001)) #,  threaded=True