# TECHIE CENTER - Backend

# Branch: DEV-7
## Ticket: DEV-8
### Issues: 
    - Please improvise on health check message. Improvised message: “Server is healthy and running”
    - Please improvise on 404 error message. Improvised error message: “Requested page or resource not found”
### Resolution: 
    - Improvised error messages as requested.

# Branch: DEV-10
## Ticket: DEV-10
### Parent Branch: DEV-8
### Issues: 
    - implement user creation functionality
    - return user guid as userId too.
    - In 400 error message only include attributes which are missing in payload
    -  In 201 response please send userId only in user object.
### Resolution: 
    - Supported user creation feature
    - handled other issues reported

# Branch: DEV-3
## Ticket: DEV-3
### Parent Branch: DEV-8
### Issues: 
    - implement user update functionality
    - When payload is empty don't return a 400. Return 200 with no change.
    - Handle error message when required fields are passed empty.
    - When password is being updated check for old password in the payload and if the old value is valid then update the new password value as of now this check is missing.
    - Please change the error to Following required fields cannot be set to  empty : password, email
    - Please change the error message to “Old password entered is invalid.“
    - Please update error message when wrong id is sent which doesn’t meet the objectID type of mongoose / mongo is sent .
    - There is a requirement change. When required fields are passed empty in the update payload ignore them rather than returning error.   
### Resolution: 
    - Supported user udpate feature
    - Handled issue related to validation
    - Handled error messages based on QA and DOC team inputs
    - Added single step verification for password change