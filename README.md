# Launching Ticket API

#### Run the application using:
npm
> npm run start

gulp

> gulp

#### To have default categories and account(s) seeded at runtime:

In Development:

> MONGO_SEED=true npm run start

In Production:

> pm2 start npm --name "ticket-api" -- run start:prod 

> pm2 list

#### To execute server side tests:

Execute all tests:
> gulp test

Test a specific server module
> gulp test:server --[MODULE]
