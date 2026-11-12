from crewai import Crew
from .agent import DrinkGeneratorAgents
from .task import DrinkGeneratorTasks


class drinkCreateCrew:
    def __init__(self, job_id, job_manager):
        self.job_id = job_id
        self.crew = None
        self.job_manager = job_manager

    def setup_crew(self, user_preference, user_input):
        agents = DrinkGeneratorAgents()
        developer = agents.beverageDeveloper(user_preference, user_input)
        summarizer = agents.summarizer()
        tasks = DrinkGeneratorTasks(self.job_id, self.job_manager)
        self.crew = Crew(
            agents=[developer, summarizer],
            tasks=[tasks.innovate_drink(developer, user_preference, user_input),
                   tasks.summarize_drink(summarizer)],
            verbose=True,
        )
        self.job_manager.append_event(self.job_id, 'Crew setup completed')

    def kickoff(self):
        if self.crew is None:
            raise RuntimeError('Crew has not been set up')
        self.job_manager.append_event(self.job_id, 'Starting beverage development...')
        return self.crew.kickoff()
