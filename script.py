import re

with open("index.html", "r", encoding="utf8") as f:
    text = f.read()

# Replace Case 1 paragraph
pattern1 = r'(<h2>Case Study 1: Diagnose Error Cause and Reasoning Patterns</h2>\s*)<p>.*?</p>'
rep1 = r'\1<p>Follow a user analyzing a structural calculation error from DeltaBench, tracing a propagated reasoning fault to its root cause while observing the model\'s retroactive self-correction strategies through uncertainty signals.</p>'
text = re.sub(pattern1, rep1, text, flags=re.DOTALL)

# Replace Case 2 paragraph
pattern2 = r'(<h2>Case Study 2: Diagnose Illusory Truth and Logical Gaps</h2>\s*)<p>.*?</p>'
rep2 = r'\1<p>Follow a user analyzing a multi-hop factual response indicating the illusory truth effect, examining how uncertain premises mutate into confirmed facts and exploring unfinished logical gaps within abandoned traces.</p>'
text = re.sub(pattern2, rep2, text, flags=re.DOTALL)

with open("index.html", "w", encoding="utf8") as f:
    f.write(text)

