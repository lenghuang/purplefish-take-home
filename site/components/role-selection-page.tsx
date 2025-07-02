"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UsersIcon, BriefcaseIcon } from "lucide-react"

type RoleSelectionPageProps = {
  onSelectRole: (role: "hunter" | "poster") => void
}

export function RoleSelectionPage({ onSelectRole }: RoleSelectionPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to AI Recruiter</CardTitle>
          <CardDescription>Please select your role to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full h-20 text-lg flex items-center justify-center space-x-3"
            onClick={() => onSelectRole("hunter")}
          >
            <UsersIcon className="h-6 w-6" />
            <span>I am a Job Hunter</span>
          </Button>
          <Button
            className="w-full h-20 text-lg flex items-center justify-center space-x-3"
            onClick={() => onSelectRole("poster")}
          >
            <BriefcaseIcon className="h-6 w-6" />
            <span>I am a Job Poster</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
