import { NextResponse } from "next/server"

const JOB_ROLES = [
  {
    id: "software-engineer",
    name: "Software Engineer",
    description: "Full-stack development with modern technologies",
    requiredSkills: ["JavaScript", "React", "Node.js", "Databases"],
  },
  {
    id: "product-manager",
    name: "Product Manager",
    description: "Strategic product planning and execution",
    requiredSkills: ["Strategy", "Analytics", "Communication", "Leadership"],
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    description: "Data analysis and machine learning",
    requiredSkills: ["Python", "Statistics", "Machine Learning", "SQL"],
  },
  {
    id: "ux-designer",
    name: "UX Designer",
    description: "User experience and interface design",
    requiredSkills: ["Design Thinking", "Prototyping", "User Research", "Figma"],
  },
]

export async function GET() {
  return NextResponse.json(JOB_ROLES)
}
