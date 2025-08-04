# Nurse Screening Bot

This is my take home project for a startup called Purplefish. The task was to build a screening agent to get questions from a candidate applying to be an ICU nurse, and to also have "agentic" behavior as well as database persistence.

While I got an end to end website working, I really struggled with getting the behavior of the bot to be more smart, use tool calls, and remember state.

I've attempted to document my progress via pull requests, here are the important ones, full with context, screenshots and more:

- [#2: POC: HR Bot CLI v0.5](https://github.com/lenghuang/purplefish-take-home/pull/2)
- [#4: feat: HR Bot CLI V1](https://github.com/lenghuang/purplefish-take-home/pull/4)
- [#7: feat: More iterations on the Site UI](https://github.com/lenghuang/purplefish-take-home/pull/7)
- [#8: feat: Update bot to use Drizzle instead](https://github.com/lenghuang/purplefish-take-home/pull/8)
- [#12: feat: Start a new Vercel V0 Template](https://github.com/lenghuang/purplefish-take-home/pull/12)
- [#14: fix: Dedupe Convos and Run Prettier](https://github.com/lenghuang/purplefish-take-home/pull/14)
- [#16: feat: Persist to sqllite with drizzle](https://github.com/lenghuang/purplefish-take-home/pull/16)
- [#18: chore: Improve persistence](https://github.com/lenghuang/purplefish-take-home/pull/18)
- [#19: Failed attempt at using langchain](https://github.com/lenghuang/purplefish-take-home/pull/19)

Some circumstances changed and I am no longer able to work on this project, so while it's not in a good state, I will document what I've achieved so far.

# Links

- To run the project: https://github.com/lenghuang/purplefish-take-home/tree/chat-bot/README.md
- To understand it: https://github.com/lenghuang/purplefish-take-home/tree/main/ARCHITECTURE.md

# Screenshots

**The website working end to end, with questionable agent performance:**

https://github.com/user-attachments/assets/08723dfd-eb8e-4b80-9b03-f79595a59b3c

| An example of db persistence | Success states |
| --- | --- |
| <img width="1766" height="1230" alt="image" src="https://github.com/user-attachments/assets/849986d8-8dcd-4c79-a845-5281e86837c9" /> |  <img width="1488" height="1244" alt="image" src="https://github.com/user-attachments/assets/781ab7ba-3e04-46b0-90d5-5d7b349602e8" /> | 



