import React from 'react';
import { Card, Avatar, Typography, Button } from '@mui/material';

type League = {
	name: string;
	sport: string;
	level: string;
	logo: string;
};

export default function LeagueCard({ league }: { league: League }) {
	return (
		<Card sx={{ mb: 2, p: 2 }}>
			<Avatar src={league.logo} sx={{ width: 56, height: 56, mr: 1 }} />
			<Typography variant="h6">{league.name}</Typography>
			<Typography>{league.sport}</Typography>
			<Typography>{league.level}</Typography>
			<Button variant="contained">View Roster</Button>
		</Card>
	);
}