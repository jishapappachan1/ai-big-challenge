import os
import json
from groq import Groq

def evaluate_creative_response(response_text: str):
    api_key = os.environ.get("GROQ_API_KEY", "dummy_key")
    if api_key == "dummy_key":
        return {
            "relevance": 25, "creativity": 25, "clarity": 20, 
            "impact": 20, "language": 0, "conciseness": 0, "total_score": 90
        }
    
    try:
        client = Groq(api_key=api_key)
        prompt = f"""
        Here is the original prompt the user was answering: "In exactly 25 words, tell us why you should win this prize."

        Evaluate the following creative submission STRICTLY on these criteria and exact maximum weights:
        - Relevance to the question (max 25)
        - Creativity and originality (max 25)
        - Clarity and expression (max 25)
        - Overall impact (max 25)

        Response: "{response_text}"

        Return ONLY a JSON object with the keys "relevance", "creativity", "clarity", and "impact" and their integer scores. Example: {{"relevance": 20, "creativity": 20, "clarity": 20, "impact": 20}}
        """
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        scores = json.loads(completion.choices[0].message.content)
        total = sum(scores.values())
        scores['total_score'] = total
        return scores
    except Exception as e:
        print(f"LLM Error: {e}")
        return {"relevance": 0, "creativity": 0, "clarity": 0, "impact": 0, "language": 0, "conciseness": 0, "total_score": 0}
