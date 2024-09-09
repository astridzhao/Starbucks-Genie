#!/usr/bin/env python
import sys
from starbucks_genie.drinkCrew import DrinkInnovationCrew
import json
# This main file is intended to be a way for your to run your
# crew locally, so refrain from adding necessary logic into this file.
# Replace with inputs you want to test with, it will automatically
# interpolate any tasks and agents information

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
    
# def train():
#     """
#     Train the crew for a given number of iterations.
#     """
#     inputs = {
#         "topic": "AI LLMs"
#     }
#     try:
#         DrinkInnovationCrew().crew().train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)

#     except Exception as e:
#         raise Exception(f"An error occurred while training the crew: {e}")

# def replay():
#     """
#     Replay the crew execution from a specific task.
#     """
#     try:
#         DrinkInnovationCrew().crew().replay(task_id=sys.argv[1])

#     except Exception as e:
#         raise Exception(f"An error occurred while replaying the crew: {e}")

# def test():
#     """
#     Test the crew execution and returns the results.
#     """
#     inputs = {
#         "topic": "AI LLMs"
#     }
#     try:
#         DrinkInnovationCrew().crew().test(n_iterations=int(sys.argv[1]), openai_model_name=sys.argv[2], inputs=inputs)

#     except Exception as e:
#         raise Exception(f"An error occurred while replaying the crew: {e}")
