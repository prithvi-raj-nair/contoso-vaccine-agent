I have to build a demo agent to solve a hypothetical problem as part of an interview for an AI company. 

## Context

Contoso is a hypothetical country. We are building a demo agent to help the health care workers involved in the national vaccination program. Contoso has many remote villages where there are no permanent health care centre employees. To meet the child immunisation requirements of these remote villages, the health care system conducts immunisation outreach activities. To do this they send health care workers from the nearest town health centre to the remote villages to carry out vaccination drives (hub and spoke model). This happens on a schedule so that each town hub can service around 5-10 remote villages. Doing this on a routine schedule is necessary because after birth babies require different vaccines at different times so routine visiting of the villages every 1-2 weeks is necessary so that all children can receive all the required vaccines at the right time.

### Hypothetical Vaccine Schedule for child immunisation

- Vaccine A - within 1 week of birth
- Vaccine B - within 6-8 weeks of birth
- Vaccine C - within 12-14 weeks of birth

### Existing digital infrastructure

- National health data base app (NHDB app) to register birth details linked to mother’s ID and phone number
- Mother’s have some official ID and children have birth certificates
- Remote villages still have basic internet connectivity and mobile phone adoption

### Metrics important for vaccination outreach

- Drop out rate - (Children getting last dose)/(children getting first dose)
- Vaccine Wastage - (Vaccines doses not used)/(Vaccines doses ordered)

## Roles and responsibilities of health care workers

### Town medical officer

- Schedule outreach drives without clashing with other events. Ensure each village should be visited once in 2 weeks.
- Order required number of doses for each vaccine from district office based on predicted need in next week’s immunisation drives
    - Need is predicted based on immunisation schedule for the children in those villages
- Prepare reports on metrics to send to central team

### On-ground workers (nurses)

- Check which town to visit today
- Load required number of vaccines in cold storage transport box
- Visit site and administer vaccines
- Fetch data of child/mom from health  figure out which vaccine to give
- Update vaccination data in database

### Problems with existing workflow

 the town medical officer faces the following problems: 

- they use a spreadsheet to track the outreach campaigns conducted. So the officer has to manually check every week which towns have been visited in the last two weeks and then prepare the schedule for the coming week
- once the towns are decided, they need to check the NHDB database to see the volume of each vaccine required and place an order for that.  this is cumbersome and requires analyzing data using SQL.
- after each outreach drive, they need to prepare a report on the important metrics, which again requires SQL analysis from the NHDB database

 the on-ground delivery team faces the following problems with their existing workflows: 

- they have to coordinate with the medical officer on a WhatsApp group to know when to visit which village and how many doses of each vaccine they need to carry on that visit
- they have to use the NHDB app for fetching data and entering data on the site, which is really cumbersome since they have to type a lot of details

## Agentic solution

My solution is to create an agent that connects to the NHDB app database as well as to the calendars of the healthcare workers to solve that they have 

### Solution for medical officer

- To schedule outreach visit the officer can just talk to the agent and say that "Schedule the visits for this week". The agent will fetch the calendar events for the last two weeks, see which villages have been visited and then schedule the visits for this week based on which villages have not been visited in the last two weeks.  these events will be scheduled in the calendar for all the workers involved to see. The details of the event, including the location and the number of each vaccine that they require, will also be included.
- to find out how many vaccines to order of each category, the officer can just ask the agent to do that, and the agent will check the NHDB database for the visits planned this week, fetch the data, and see how many vaccines of each type will be needed as per the vaccine plan
- to prepare a report on the metrics, again the officer just needs to ask the agent, and it will fetch the data, analyze it, and share the metrics

### Solution for on-ground workers

- To know which villages they have to visit this week and how many vaccines they have to carry, they can just ask the agent. The agent will check the calendar, and the event descriptions will tell you how many vaccines and which villages.
- to fetch the data for a particular mother or child, they can just take the photo of the mother's ID card and send it to the agent. The agent will extract the ID number and query the NHDB database to fetch the details and immediately tell you the vaccination history and what is the next vaccine due for that child
- after they vaccinate, they can just ask the agent to update that they have done the next vaccination for that child, and the agent will update it in the NHDB database

## Technical architecture

### Custom GPT from ChatGPT as the agent and interface

- I'll use Custom GPT as the agent for this solution. It will have specific instructions and files giving context about the situation.
- So for the actual agent, there is no new development required. It will just be prompts that I add to Claude desktop.
- the Calendar and NHDB app database will be web apps servers whose APIs the custom GPT can call as actions

### SimpleCal calendar app

- this is a simple calendar app to be used as part of the demo for the agent's capabilities
- it has very simple functionalities of a calendar app
    - Only a “week” view found in standard calendar apps (sunday to saturday laid out as columns)
        - All day events are shown at the top of the day
        - Other events are arranged vertically as per their start and end times like normal calendar apps
    - Add event with following details
        - Name
        - Description
        - Start time
        - End time
        - All day event check box
    - Click on an event in the calendar view to view the details and reveal delete button
    - Delete event
- The Backend APIs for this will be used by the UI and also the custom GPT to take actions
- The fetch events API can have as input a start and end time so that the custom GPT can also use it flexibly to fetch events from the last two weeks.

### NHDB app

- This is a very simple app that acts as an interface between the National Health Database and the on-ground workers who use the database
- It also has very simple functionality available in the UI
    - Enter new parent details
        - Name
        - Govt ID number
        - date of birth
        - Village
    - Enter new Child details
        - Name
        - Govt ID number (optional)
        - date of birth
        - Parent ID (foreign key)
        - Village
    - Fetch child details for mother - users mom’s ID to fetch child’s details and vaccination history as well as details of the next vaccine that is due for the child and when
        - The children of a mother are listed and you have to click on it to view the details of an individual child
        - When viewing the details for a child, you can record a “vaccination visit” in which you set the date and the vaccine that was given or if no vaccine was given then “no vaccine required” or “Vaccine not available” as the options from a drop down list
- Apart from the UI functionality mentioned above, there are some “reporting and aggregation” functionalities that are not shown in the UI but will only have backend APIs
    - Get the required number of vaccines of each type required in the given week for a given village. This will analyse the vaccination schedules for all the children in that village and count the next vaccines due in the given week.
        - Returns Village name, and count of vaccines of each type (A,B and C)
    - Get the vaccination drop out rate trends
        - Returns a monthly view of drop out rate for each village for last 6 months
    - Get wastage trends by calculating mismatch between expected number of vaccines that the workers would have taken to the village and the actual vaccinations that happened (basically any child that missed any dose of vaccine will be counted as a wastage)
        - Returns wastage of vaccines in last 6 months for all 3 vaccines