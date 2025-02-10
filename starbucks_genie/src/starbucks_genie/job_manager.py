from dataclasses import dataclass
from datetime import datetime, timedelta
from threading import Lock
from typing import Dict, List

@dataclass
class Event:
    timestamp: datetime
    data: str
    
@dataclass
class Job:
    status: str
    events: List[Event]
    result: str

class JobManager:
    def __init__(self):
        self.jobs = {}
        self.lock = Lock()
        
    def cleanup_old_jobs(self, max_age_hours=1):
        with self.lock:
            now = datetime.now()
            to_delete = []
            for job_id, job in self.jobs.items():
                if job.created_at < now - timedelta(hours=max_age_hours):
                    to_delete.append(job_id)
            for job_id in to_delete:
                del self.jobs[job_id]

    def append_event(self, job_id: str, event_data: str):
        with self.lock:
            print("Current job: ", self.jobs.items());
            if job_id not in self.jobs:
                print(f"Creating new job: {job_id}")
                self.jobs[job_id] = Job(
                    status="STARTED",
                    events=[],
                    result=""
                )
            
            print(f"Appending event to job {job_id}: {event_data}")
            self.jobs[job_id].events.append(
                Event(
                    timestamp=datetime.now(),
                    data=event_data
                )
            )