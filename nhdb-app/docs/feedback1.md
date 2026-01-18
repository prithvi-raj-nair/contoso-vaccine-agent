- Change the heading to say “National Health Database”
- Remove the “add parent” and “add child” buttons from the top navbar
- When the record vaccine visit modal opens up, the entire background goes completely black. Instead can we make it a  translucent background where the underlying page is still visible with the child details.
- Make the dev server always run on port 3002 so that it doesn’t clash with other apps in this project

### Simulated data in DB

Lets clean up the dummy data we have added in the data base. I saw some data that didn’t make sense like a mother with two children born 3-4 weeks apart.

- First clean all the data in the DB if required, except for the villages. Keep the existing village names.
- Every village should have 100 births in every month for the last 6 months and also this month up to current date, since we are in the middle of january, let there be only 50 births)
- The births must be randomly distributed over the days of the month
- One mother must have only one child
- For all the children, in the past 6 months, record vaccinations in the correct time with the following probabilities. The probability values can be randomly selected for each village within the specified range to create realistic variations.
    - 60-70% of all children get vaccine A (first dose).
    - 70-80% of children getting Vaccine A also get vaccine B dose on time
    - 80-90% of children getting vaccine B also get vaccine C dose on time
- For those children whose vaccine does is not due yet as per current date, do not record incorrect data