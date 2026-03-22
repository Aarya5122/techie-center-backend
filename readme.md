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

# Branch: DEV-11
## Ticket: DEV-11
### Parent Branch: DEV-9
### Issues:
    - implement post creation functionality with post content.
    - While creating post with comments and likes are getting ignored.
    - update createPost function to create post with photo.
    - In 201 response please send postId only in post object.