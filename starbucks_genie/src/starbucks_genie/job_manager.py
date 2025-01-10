from dataclasses import dataclass
from datetime import datetime
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

jobs_lock = Lock()
jobs: Dict[str, Job] = {}

def append_event(job_id: str, event_data: str):
    with jobs_lock:
        if job_id not in jobs:
            print(f"Start job: ", job_id)
            jobs[job_id] = Job(
                status="STARTED",
                events=[],
                result=""
            )
        else:
            print(f"Appending event for job: ", job_id)
            job = jobs[job_id]
            job.events.append(
                Event(
                    timestamp=datetime.now(),
                    data=event_data)
            )