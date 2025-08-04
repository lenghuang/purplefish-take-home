# Nurse Screening Bot

https://github.com/user-attachments/assets/08723dfd-eb8e-4b80-9b03-f79595a59b3c

This is my take home project for a startup called Purplefish. The task was to build a screening agent to get questions from a candidate applying to be an ICU nurse, and to also have "agentic" behavior as well as database persistence.

While I got an end to end website working, I really struggled with getting the behavior of the bot to be more smart, use tool calls, and remember state.

I've attempted to document my progress via pull requests, here are the important ones, full with context, screenshots and more:

- https://github.com/lenghuang/purplefish-take-home/pull/2
- https://github.com/lenghuang/purplefish-take-home/pull/4
- https://github.com/lenghuang/purplefish-take-home/pull/7
- https://github.com/lenghuang/purplefish-take-home/pull/8
- https://github.com/lenghuang/purplefish-take-home/pull/12
- https://github.com/lenghuang/purplefish-take-home/pull/14
- https://github.com/lenghuang/purplefish-take-home/pull/16
- https://github.com/lenghuang/purplefish-take-home/pull/18
- https://github.com/lenghuang/purplefish-take-home/pull/19

Some circumstances changed and I am no longer able to work on this project, so while it's not in a good state, I will document what I've achieved so far.

# Screenshots

**The website working end to end, with questionable agent performance:**

https://github.com/user-attachments/assets/08723dfd-eb8e-4b80-9b03-f79595a59b3c

**An example of db persistence:**
https://private-user-images.githubusercontent.com/32604574/463991081-04240ba4-a5af-4460-a324-4886d4de6b97.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NTQzMTc4MzIsIm5iZiI6MTc1NDMxNzUzMiwicGF0aCI6Ii8zMjYwNDU3NC80NjM5OTEwODEtMDQyNDBiYTQtYTVhZi00NDYwLWEzMjQtNDg4NmQ0ZGU2Yjk3LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTA4MDQlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUwODA0VDE0MjUzMlomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWMwNmE1ODI0MWFlNzc2N2YyYzg5ZmQ0ODFmNWY4NTA1NTQ0Nzg4Y2RmN2YyNmRjNjNhNzc3MWQwMWM4NDkwNjAmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.hfWcl7QFXSGqV158OIHe1a2_EyEYS1xETi_V3Q0-kvw

# Architecture

- https://github.com/lenghuang/purplefish-take-home/tree/main/ARCHITECTURE.md
