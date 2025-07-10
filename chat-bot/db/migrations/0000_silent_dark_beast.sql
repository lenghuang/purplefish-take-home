CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_name` text,
	`created_at` integer,
	`updated_at` integer,
	`completed` integer,
	`ended_early` integer,
	`end_reason` text,
	`last_message` text,
	`state_id` text
);
--> statement-breakpoint
CREATE TABLE `interview_states` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`stage` text,
	`candidate_name` text,
	`position` text,
	`desired_salary` integer,
	`salary_acceptable` integer,
	`has_license` integer,
	`license_number` text,
	`license_expiry` text,
	`has_experience` integer,
	`experience_years` integer,
	`completed` integer,
	`ended_early` integer,
	`end_reason` text
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text,
	`content` text,
	`created_at` integer NOT NULL
);
