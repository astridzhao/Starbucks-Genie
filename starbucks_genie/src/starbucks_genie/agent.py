from crewai import Agent
from crewai_tools import (
    FileReadTool,
    SerperDevTool,
    WebsiteSearchTool
)
from langchain_openai import ChatOpenAI

# web_search_tool = WebsiteSearchTool()
# seper_dev_tool = SerperDevTool()
# ingredients_read_tool = FileReadTool(
#     file_path='./ingredients.md',
#     description='A tool to read the ingredient from starbucks.'
# )

class DrinkGeneratorAgents:
    def __init__(self):
        print(f"Setting agents for create drink.")
        # self.llm = ChatOpenAI(model="gpt-4o-mini")
        # self.web_search_tool = WebsiteSearchTool()
        # self.seper_dev_tool = SerperDevTool()
        self.ingredients_read_tool = FileReadTool(
            file_path='starbucks_genie/src/starbucks_genie/tools/ingredients.md',
            description='A tool to read the ingredient from starbucks.'
        )
    
    def beverageDeveloper(self, user_preference, user_input) -> Agent:
        agent = Agent(
            role = "Beverage Product Developer",
            goal = f"""Create a new drink meeting user requsted theme or wish: {user_input}, plus considering flavor 
                        combinations (e.g. sweet, rich, fruity) and customer preferences: {user_preference} 
                        Important:
                        - Only use the ingredients provided from the reading tool "ingredients_read_tool".
                        """,
            backstory = """As an innovative beveraging creator, you focus on crafting unique beverages for every user. 
                Try you best to meet user preference.""",
            # llm=self.llm,
            # tools=self.ingredients_read_tool, 
            verbose=True,
            allow_delegation=True,
            )
        print("create beverageDeveloper")
        return agent
    
    def summarizer(self) -> Agent:
        agent = Agent(
            role = "Drink Summarizer",
            goal = "You can capture and convey the essence of the newly created drink.",
            backstory = """Your task includes naming the drink, summarizing the ingredients list, 
                and explaining why it is recommended thus aiding in marketing and customer decision-making.
                Important: The final result should be a JSON object including the keys: name, ingredients, recommendation reason.
                """,
            # llm=self.llm,
            verbose=True,
            allow_delegation=False,
        )
        print("create summarizer")
        return agent
        
        