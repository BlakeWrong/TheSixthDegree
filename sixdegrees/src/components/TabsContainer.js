import React, { useState } from 'react';
import {
	Tabs,
	Tab,
	Menu,
	MenuItem,
	useMediaQuery,
	Box,
	Paper,
	IconButton,
	Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MovieToMovieTab from './MovieToMovieTab';
import MovieToPersonTab from './MovieToPersonTab';
import PersonToPersonTab from './PersonToPersonTab';
import MenuIcon from '@mui/icons-material/Menu';

function TabsContainer() {
	const [activeTab, setActiveTab] = useState('movie-to-movie');
	const [menuAnchorEl, setMenuAnchorEl] = useState(null);
	const theme = useTheme();
	const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

	// Render the correct content for the active tab
	const renderActiveTab = () => {
		switch (activeTab) {
			case 'movie-to-movie':
				return <MovieToMovieTab />;
			case 'movie-to-person':
				return <MovieToPersonTab />;
			case 'person-to-person':
				return <PersonToPersonTab />;
			default:
				return null;
		}
	};

	// Handle tab change for larger screens
	const handleTabChange = (event, newValue) => {
		setActiveTab(newValue);
	};

	// Handle menu opening for smaller screens
	const handleMenuOpen = (event) => {
		setMenuAnchorEl(event.currentTarget);
	};

	// Handle menu item selection and close the menu
	const handleMenuClose = (tab) => {
		setActiveTab(tab);
		setMenuAnchorEl(null);
	};

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				mt: 3,
				px: 2, // Add padding for small screens
			}}
		>
			<Paper
				elevation={3}
				sx={{
					width: '100%',
					padding: 3,
					backgroundColor: 'white',
					borderRadius: 2,
					boxShadow: theme.shadows[2],
				}}
			>
				{/* Tabs or Hamburger Menu */}
				{isSmallScreen ? (
					<Box>
						<IconButton
							aria-controls="tabs-menu"
							aria-haspopup="true"
							onClick={handleMenuOpen}
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: theme.palette.primary.main,
							}}
						>
							<MenuIcon fontSize="large" />
							<Typography
								sx={{
									ml: 1,
									fontWeight: 'bold',
									color: theme.palette.primary.main,
								}}
							>
								Menu
							</Typography>
						</IconButton>
						<Menu
							id="tabs-menu"
							anchorEl={menuAnchorEl}
							open={Boolean(menuAnchorEl)}
							onClose={() => handleMenuClose(activeTab)}
							PaperProps={{
								style: {
									width: '200px',
								},
							}}
						>
							<MenuItem
								onClick={() => handleMenuClose('movie-to-movie')}
								selected={activeTab === 'movie-to-movie'}
							>
								Movie to Movie
							</MenuItem>
							<MenuItem
								onClick={() => handleMenuClose('movie-to-person')}
								selected={activeTab === 'movie-to-person'}
							>
								Movie to Person
							</MenuItem>
							<MenuItem
								onClick={() => handleMenuClose('person-to-person')}
								selected={activeTab === 'person-to-person'}
							>
								Person to Person
							</MenuItem>
						</Menu>
					</Box>
				) : (
					<Tabs
						value={activeTab}
						onChange={handleTabChange}
						indicatorColor="primary"
						textColor="primary"
						variant="fullWidth"
					>
						<Tab label="Movie to Movie" value="movie-to-movie" />
						<Tab label="Movie to Person" value="movie-to-person" />
						<Tab label="Person to Person" value="person-to-person" />
					</Tabs>
				)}

				{/* Active Tab Content */}
				<Box sx={{ mt: 3 }}>{renderActiveTab()}</Box>
			</Paper>
		</Box>
	);
}

export default TabsContainer;
