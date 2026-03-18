from pydantic import BaseModel, EmailStr

class RegisterSchema(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"