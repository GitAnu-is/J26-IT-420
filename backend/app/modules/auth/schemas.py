from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator


class RegisterRequest(BaseModel):
    fullName: Optional[str] = None
    name: Optional[str] = None
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    phoneNumber: Optional[str] = Field(default="", max_length=25)
    role: str = Field(default="FARMER")

    @model_validator(mode="before")
    @classmethod
    def populate_name_fields(cls, values):
        if isinstance(values, dict):
            fn = values.get("fullName") or values.get("name")
            if fn:
                values["fullName"] = fn
                values["name"] = fn
        return values



class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class RefreshRequest(BaseModel):
    refreshToken: str = Field(..., min_length=10)


class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(..., min_length=1)
    newPassword: str = Field(..., min_length=8, max_length=128)
