# import config
from crewai import Agent, Task, Crew, Process, LLM
from crewai.project import CrewBase, agent, crew, task
from crewai.tasks.output_format import OutputFormat
import os
from langchain_cohere import ChatCohere

# Importing crewAI tools
from crewai_tools import (
    FileReadTool,
    SerperDevTool,
    WebsiteSearchTool
)
from typing import List, Optional, Type
from pydantic import BaseModel, Field, model_validator
from pydantic_core import PydanticCustomError


#=================
# CrewAI Tools https://github.com/crewAIInc/crewAI-examples/blob/main/job-posting/src/job_posting/job_description_example.md
#=================
web_search_tool = WebsiteSearchTool()
seper_dev_tool = SerperDevTool()
ingredients_read_tool = FileReadTool(
    file_path='ingredients.md',
    description='A tool to read the ingredient from starbucks.'
)

#=================
# Json Output Templates
#=================
class DrinkIngredients(BaseModel):
    drink_name: List[str]  = Field(..., description="Name of the new drink")
    type_of_beverage: str = Field(..., description="Choose one of three preparation methods: 'Hot', 'Iced', 'Blended'")
    base: str = Field(..., description="Choose one base from: 'coffee', 'green tea', 'black tea', 'espresso'")
    tea:  str  = Field(..., description="choose one from: 'no added', 'add chai'")
    powder: List[str]  = Field(..., description="powders from 'chocolate malt powder', 'vanilla bean powder'"),
    sauces: List[str]  = Field(..., description="list of sauces 'dark caramel', 'mocha sauce', 'pumpkin sauce', 'white chocolate mocha sauce'"),
    syrup: List[str] = Field(..., description="List of syrups from: 'apple brown syrup', 'Brown Sugar Syrup', 'Caramel Syrup', 'Cinnamon Dolce Syrup', 'Hazelnut Syrup', 'Peppermint Syrup', 'Sugar-Free Vanilla Syrup', 'Toffeenut Syrup', 'Vanilla Syrup'")
    liquid_sweeteners: str = Field(..., description="Choose one from 'classic syrup', 'honey blend'")
    sweetener_packets: List[str] = Field(..., description="Choose one or more from 'honey', 'splenda', 'stevia', 'sugar', 'sugar in the raw'")
    cold_foam: List[str] = Field(..., description="Choose from 'Apple Crisp Cream Cold Foam', 'Chocolate Cream Cold Foam', 'Matcha Cream Cold Foam', 'Oleato Golden Foam', 'Salted Caramel Cream Cold Foam', 'Strawberry Cream Cold Foam', 'Vanilla Sweet Cream Cold Foam'")
    nondairy_cold_foam: List[str] = Field(..., description="Choose from 'Nondairy Apple Crisp Cream Cold Foam', 'Nondairy Chocolate Cream Cold Foam', 'Nondairy Matcha Cream Cold Foam', 'Nondairy Oleato Golden Foam', 'Nondairy Salted Caramel Cream Cold Foam', 'Nondairy Strawberry Cream Cold Foam', 'Nondairy Vanilla Sweet Cream Cold Foam'")
    cinnamon_powder: str = Field(..., description="Choose one from 'no cinnamon powder', 'light cinnamon powder', 'cinnamon powder', 'extra cinnamon powder'")
    drizzle: List[str] = Field(..., description="Choose from 'caramel drizzle', 'mocha drizzle', 'spiced apple drizzle'")
    topping: List[str] = Field(..., description="Choose from 'caramel crunch', 'cinnamon crumble', 'cinnamon dolce', 'cookie crumble', 'pumpkin spice'")
    whipped_cream: str = Field(..., description="Choose one from 'no whipped cream', 'light whipped cream', 'regular whipped cream', 'extra whipped cream'")
    add_line_the_cup: str = Field(..., description="Choose from 'line the cup with caramel sauce', 'line the cup with mocha sauce', '...'")
    add_in_water: str = Field(..., description="Choose one from 'no water', 'light water', 'water', 'extra water'")
    add_in_room: str = Field(..., description="Choose one from 'no room', 'light room', 'room', 'extra room'")
    creamer_options: str = Field(..., description="Choose from 'Splash of 2% Milk', 'Splash of Almondmilk', 'Splash of Coconutmilk', 'Splash of Cream (Half & Half)', 'Splash of Heavy Cream', 'Splash of Nondairy Vanilla Sweet Cream', 'Splash of Nonfat Milk', 'Splash of Oatmilk', 'Splash of Soymilk', 'Splash of Vanilla Sweet Cream', 'Splash of Whole Milk'")
    size_options: str = Field(..., description="Choose one from 'Tall', 'Grande', 'Venti'")
    unique_selling_point: str = Field(..., description="Describe what makes this drink unique")

class NutritiousInfo(BaseModel):
    nutrition: List[str]  = Field(..., description="List of Calorie, Fat, Protein, Carb, Sugar in the drink")

class DrinkInfo(BaseModel):
    name: str = Field(..., description="Name of the drink")
    ingredient: List[str]  = Field(..., description="List of ingredients")
    # nutrition: List[str]  = Field(..., description="List of nutrition data")
    recommendation: str = Field(..., description="reason why innovate the drink")
    
#=================
# Crew Agents
#=================
@CrewBase
class DrinkInnovationCrew:

    """StarbucksGenie drink innovation crew"""
    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'
    
    @agent
    def innovator(self, ) -> Agent:
        return Agent(
            config=self.agents_config['beverageDeveloper'],
            allow_delegation=False,
            verbose=True,
            tools=[ingredients_read_tool], 
            # llm = llm,
    )

    @task
    def innovation_drink(self) -> Task: 
        return Task(
            config=self.tasks_config['innovateDrink'],
            agent=self.innovator(),
            output_json=DrinkIngredients,
    )
        
    # @agent
    # def nutritionist(self) -> Agent:
    #     return Agent(
    #         config=self.agents_config['nutritionist'],
    #         allow_delegation=False,
    #         verbose=True,
    #         # llm = llm
    # )
        
    # @task
    # def nutrition_calculation(self) -> Task: 
    #     return Task(
    #         config=self.tasks_config['nutritionCalculate'],
    #         agent=self.nutritionist(),
    #         output_json=NutritiousInfo,
    # )
        
    @agent
    def summarizer(self) -> Agent:
        return Agent(
            config=self.agents_config['summarizer'],
            allow_delegation=False,
            verbose=True,
            # llm=llm
    )
        
    @task
    def summarizion_drink(self) -> Task: 
        return Task(
            config=self.tasks_config['drinkSummarize'],
            agent=self.summarizer(),
            output_json=DrinkInfo
    )
        
    @model_validator(mode="after")
    def check_output(self):
        """Check if an output type is set."""
        output_types = [self.output_json, self.output_pydantic]
        if len([type for type in output_types if type]) > 1:
            raise PydanticCustomError(
                "output_type",
                "Only one output type can be set, either output_pydantic or output_json.",
                {},
            )
        return self

        
    @crew
    def crew(self) -> Crew:
        """Creates a Starbucks Innovation Crew"""
        return Crew(
            agents=self.agents,  
            tasks=self.tasks, 
            process=Process.sequential,
            memory=False,
            verbose=True,
        )



