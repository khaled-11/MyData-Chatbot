# MyData-Chatbot
Chatbot connected to ML Endpoints to translate passport and forms images into data. We can store the data in a database and develop a tool that allow the user to use it in an automated form filing.

# How to use this experience:
You will need AWS developer account, Facebook page, Facebook Developer account, and node.js. First, get the page access token for the Facebook Messenger ChatBot, then setup the AWS access token and secret. Next, subscribe to the Mphasis Autocode WireframeToCode model in Amazon Sagemaker, then create an end-point and set it up in the readPassport.js. Now, create a new environment in Amazon Elastic Beanstalk, zip the project, then deploy the project. Finally, add the PAGE_ACESS_TOKEN in the environment variables.
