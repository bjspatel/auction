### Instructions to deploy and run the application

  *** Install database ***
  1) Install postgresql database
  2) Create a database named "mpa"

  *** Install Application ***
  1) Install node.js
  2) Unzip the application file
  3) Open command prompt, and go to the application folder
  4) Run "npm install"
  5) Run "npm install -g bower"
  6) Run "bower install"
  7) Set the database host/port/username/password in config/development.js file

  *** Run Appllication ***
  1) Run "npm start"
  The application will start creating database tables as per the schema defined in "app/init/schema.js file".
  When below message appears:
  > Finished initialising database table
  > Server is running on port: 3000
  Then the application has started.


### Instructions to create and initialize the database
  There is no need to import the sql file in the database exclusively.
  When you run the application, it will take care of creating tables with all the fields considering their restrictions and data-types
  For manually importing the database schema into the database, the sql file is available in the /db/script.sql in application folder


### Requirements not covered
  The application development is not complete yet.
  The backend of the application is fully complete, and it will require no change.
  But there are some features remained in the frontend.
  Currently in the application major functionality of the widgets "Player Stat" and "Items" are done
  The third widget "Current Auction" is not working yet. However the backend support of the features are done completely.
