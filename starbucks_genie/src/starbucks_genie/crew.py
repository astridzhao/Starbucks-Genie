from crewai import Crew
from .agent import DrinkGeneratorAgents
from .job_manager import JobManager
from .task import DrinkGeneratorTasks

class drinkCreateCrew:
    def __init__(self, job_id:str):
        self.job_id = job_id
        self.crew = None
        self.job_manager = JobManager()
    
    def setup_crew(self, user_preference, user_input):
        print(f"Set up crew for make drink with {user_preference} and {user_input}")
        #set up AGENT
        agents = DrinkGeneratorAgents()
        beverageDeveloper = agents.beverageDeveloper(user_preference, user_input)
        summarizer = agents.summarizer()
        
        #set up TASK
        tasks = DrinkGeneratorTasks(job_id=self.job_id)
        innovate_drink = tasks.innovate_drink(beverageDeveloper, user_preference, user_input)
        summarize_drink = tasks.summarize_drink(summarizer)
        #create CREW
        try:
            self.crew = Crew(
                agents = [beverageDeveloper,summarizer],
                tasks = [innovate_drink, summarize_drink],
                verbose = True
            )
            print("Set up crew DONE")
        except Exception as e:
            print(f"Set up crew FAILED: {str(e)}")
        
    def kickoff(self):
        self.job_manager.append_event(self.job_id, "Starting beverage development...")
        #kick off crew 
        if not self.crew:
            print(f"No crew found for job id {self.job_id}")
            return 
        
        print("kick off crew STARTED")
        self.job_manager.append_event(self.job_id, "CREW STARTED")
        try:
            print(f"kick off crew for job id {self.job_id}")
            results = self.crew.kickoff()
            self.job_manager.append_event(self.job_id, "CREW COMPLETED")
            return results
        except Exception as e:
            self.job_manager.append_event(self.job_id, f"CREW FAILED: {str(e)}")
            return "kick off crew failed" + str(e)
        