from crewai import Task
from .models import DrinkIngredients, NutritiousInfo, DrinkInfo
from textwrap import dedent
from .job_manager import JobManager

class DrinkGeneratorTasks:
    def __init__(self, job_id) :
        self.job_id = job_id
        self.job_manager = JobManager()
    
    def append_event_callback(self, task_output):
        print(f"Append event for {self.job_id}")
        print(f"Task output: {task_output}")
        self.job_manager.append_event(job_id=self.job_id, event_data=task_output.expected_output)
        
    def innovate_drink(self, agent, user_preference, user_input) -> Task:
        task = Task(
            description=dedent(f"""Focus on creating a unique and flavorful beverage 
            that aligns with user's requirement: {user_input} and user's preference: 
            {user_preference}.
            Double check did not use any unprovided ingredients reading from the file.
            """),
            agent=agent,
            expected_output="""Please provide a detailed drink recipe in JSON format with:
            - drink_name: The name of the drink
            - type_of_beverage: Type of drink
            - base: Main ingredient
            - ingredients: List of all ingredients with measurements
            - preparation: Step by step instructions
            """,
            callback=self.append_event_callback,
            output_json=DrinkIngredients,
        )
        return task
    
    def summarize_drink(self, agent) -> Task:
        task = Task(
            description="Summarize the newly created drink by listing its name, ingredients, and recommendation reason.",
            agent=agent,
            expected_output="""Please provide a summary in JSON format with:
            - name: The final name of the drink
            - ingredients: List of all ingredients used
            - recommendation: A compelling reason why customers would enjoy this drink
            """,
            callback=self.append_event_callback,
            output_json=DrinkInfo,
        )
        return task