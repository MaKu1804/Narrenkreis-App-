import sys

with open('src/components/ForumView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Verify line 380 and line 440
print("Line 380:", repr(lines[379]))
print("Line 381:", repr(lines[380]))
print("Line 439:", repr(lines[438]))
print("Line 440:", repr(lines[439]))
