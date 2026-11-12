from dataclasses import dataclass, field
from datetime import datetime, timedelta
from threading import Lock
from typing import Any, List


@dataclass
class Event:
    timestamp: datetime
    data: str


@dataclass
class Job:
    status: str
    events: List[Event]
    result: Any = None
    created_at: datetime = field(default_factory=datetime.now)


class JobManager:
    def __init__(self):
        self.jobs = {}
        self.lock = Lock()

    def cleanup_old_jobs(self, max_age_hours=1):
        with self.lock:
            cutoff = datetime.now() - timedelta(hours=max_age_hours)
            expired = [job_id for job_id, job in self.jobs.items()
                       if job.status in ('SUCCESS', 'ERROR') and job.created_at < cutoff]
            for job_id in expired:
                del self.jobs[job_id]

    def append_event(self, job_id: str, event_data: str):
        with self.lock:
            if job_id not in self.jobs:
                self.jobs[job_id] = Job(status='STARTED', events=[])
            self.jobs[job_id].events.append(Event(datetime.now(), event_data))
