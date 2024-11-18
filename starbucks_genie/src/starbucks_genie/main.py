#!/usr/bin/env python
from starbucks_genie.drinkCrew import DrinkInnovationCrew
import json

def run():
    """
    Run the drink Crew
    """
    inputs = {
        'user-preference':"vegan",
        'user-input':"autumn, fruit"
    }
    result = DrinkInnovationCrew().crew().kickoff(inputs=inputs)
    
    print("######################")
    print(result)
    
    print("######################")
    data = json.loads(result)
    # Accessing data
    name = data['name']
    ingredients = data['ingredient']
    nutrition = data['nutrition']
    recommendation = data['recommendation']

    # Example of outputting the information
    print(f"Drink Name: {name}")
    print("Ingredients:")
    for ingredient in ingredients:
        print(f" - {ingredient}")
    print("Nutritional Information:")
    for info in nutrition:
        print(f" - {info}")
    print(f"Recommendation: {recommendation}")