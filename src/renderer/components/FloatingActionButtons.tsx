import { useState } from 'react';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';

// Icons
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import InfoIcon from '@mui/icons-material/Info';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';

import './FloatingActionButtons.css';

interface FloatingActionButtonsProps {
  hasVideo: boolean;
  onOpenFile: () => void;
  onDownloadUrl: () => void;
  onToggleMetadata?: () => void;
  onCloseVideo?: () => void;
}

export function FloatingActionButtons({
  hasVideo,
  onOpenFile,
  onDownloadUrl,
  onToggleMetadata,
  onCloseVideo,
}: FloatingActionButtonsProps) {
  // eslint-disable-next-line no-undef
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  // eslint-disable-next-line no-undef
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleOpenFile = () => {
    handleMenuClose();
    onOpenFile();
  };

  const handleDownload = () => {
    handleMenuClose();
    onDownloadUrl();
  };

  const handleCloseVideo = () => {
    handleMenuClose();
    if (onCloseVideo) {
      onCloseVideo();
    }
  };

  if (hasVideo) {
    // Video is playing - show FABs in top-right corner
    return (
      <div className="fab-container top-right" data-testid="fab-main-menu">
        {onToggleMetadata && (
          <Tooltip title="Toggle Info" placement="left">
            <IconButton
              onClick={onToggleMetadata}
              sx={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.8)',
                },
              }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Menu" placement="left">
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.8)',
              },
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleOpenFile}>
            <FolderOpenIcon sx={{ mr: 1 }} /> Open File
          </MenuItem>
          <MenuItem onClick={handleDownload}>
            <CloudDownloadIcon sx={{ mr: 1 }} /> Download Video
          </MenuItem>
          <MenuItem onClick={handleCloseVideo}>
            <CloseIcon sx={{ mr: 1 }} /> Close Video
          </MenuItem>
        </Menu>
      </div>
    );
  }

  // No video - show centered FABs
  return (
    <div className="fab-container centered" data-testid="fab-centered">
      <Tooltip title="Open Local File" placement="top">
        <Fab
          color="primary"
          size="large"
          onClick={onOpenFile}
          sx={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            mb: 2,
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.9)',
            },
          }}
        >
          <FolderOpenIcon sx={{ fontSize: 32 }} />
        </Fab>
      </Tooltip>

      <Tooltip title="Download from URL" placement="bottom">
        <Fab
          color="primary"
          size="large"
          onClick={onDownloadUrl}
          sx={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.9)',
            },
          }}
        >
          <CloudDownloadIcon sx={{ fontSize: 32 }} />
        </Fab>
      </Tooltip>
    </div>
  );
}
