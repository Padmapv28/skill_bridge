"""Request/response schemas for resume endpoints."""
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class EducationItem(BaseModel):
    degree: str
    branch: Optional[str] = None
    college: Optional[str] = None
    year: Optional[int] = None


class ProjectItem(BaseModel):
    title: str
    description: Optional[str] = None


class ExperienceItem(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None


class ResumeCreateRequest(BaseModel):
    name: str
    email: EmailStr
    education: List[EducationItem] = []
    skills: List[str] = []
    projects: List[ProjectItem] = []
    experience: List[ExperienceItem] = []
    certifications: List[str] = []


class ResumeUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    education: Optional[List[EducationItem]] = None
    skills: Optional[List[str]] = None
    projects: Optional[List[ProjectItem]] = None
    experience: Optional[List[ExperienceItem]] = None
    certifications: Optional[List[str]] = None


class ResumeResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: EmailStr
    education: List[EducationItem] = []
    skills: List[str] = []
    projects: List[ProjectItem] = []
    experience: List[ExperienceItem] = []
    certifications: List[str] = []


class ResumeAnalyzeRequest(BaseModel):
    resume_id: Optional[str] = None
    skills: Optional[List[str]] = None
    education: Optional[List[EducationItem]] = None
    projects: Optional[List[ProjectItem]] = None
    experience: Optional[List[ExperienceItem]] = None
    certifications: Optional[List[str]] = None


class ResumeAnalysisResponse(BaseModel):
    skills: List[str]
    education: List[EducationItem]
    experience: List[ExperienceItem]
    projects: List[ProjectItem]
    certifications: List[str]
