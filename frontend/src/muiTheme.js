import { createTheme } from '@mui/material/styles'
import Fade from '@mui/material/Fade'

export const theme = createTheme({
    palette: {
    mode: 'dark',
    primary: { main: '#6366F1', light: '#A855F7', dark: '#4f46e5' },
    secondary: { main: '#34D399', light: '#6ee7b7', dark: '#059669' },
    success: { main: '#34d399' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    background: {
      default: '#0B0914',
      paper: 'rgba(19, 15, 37, 0.55)'
    },
    text: {
      primary: '#ffffff',
      secondary: '#A1A1AA'
    },
    divider: 'rgba(148, 163, 184, 0.1)'
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'dark',
          scrollbarColor: 'rgba(77,166,255,0.55) rgba(255,255,255,0.06)',
          scrollbarWidth: 'thin',
          '--hl-glow-strength': '0.72',
          '--hl-card-gap': '32px',
          '--hl-accent-glow': 'rgba(77, 166, 255, 0.35)',
          '--hl-mesh-1': 'rgba(76, 29, 149, 0.22)',
          '--hl-mesh-2': 'rgba(49, 46, 129, 0.18)',
          '--hl-mesh-3': 'rgba(30, 27, 75, 0.16)'
        },
        body: {
          backgroundColor: '#0B0914',
          backgroundImage: 'none',
          animation: 'none'
        },
        'body::after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.05,
          mixBlendMode: 'normal',
          background:
            'radial-gradient(ellipse 100% 70% at 12% 0%, rgba(76, 29, 149, 0.2), transparent 55%), radial-gradient(ellipse 90% 60% at 92% 8%, rgba(30, 27, 75, 0.16), transparent 58%), radial-gradient(ellipse 100% 50% at 50% 100%, rgba(0, 0, 0, 0.5), transparent 55%)',
          filter: 'blur(88px)',
          animation: 'hl-aurora-mesh 72s ease-in-out infinite'
        },
        '[data-hl-theme="ocean"] body': {
          backgroundImage:
            'radial-gradient(920px 460px at 8% 0%, rgba(0,200,255,0.28), transparent 58%), radial-gradient(880px 520px at 88% 10%, rgba(0,220,180,0.2), transparent 62%), radial-gradient(800px 440px at 50% 100%, rgba(77,166,255,0.18), transparent 58%)'
        },
        '[data-hl-theme="violet"] body': {
          backgroundImage:
            'radial-gradient(880px 440px at 14% 0%, rgba(167,139,250,0.28), transparent 55%), radial-gradient(760px 450px at 86% 12%, rgba(255,91,154,0.2), transparent 60%), radial-gradient(940px 520px at 50% 100%, rgba(77,166,255,0.16), transparent 58%)'
        },
        '*::-webkit-scrollbar': {
          width: 10,
          height: 10
        },
        '*::-webkit-scrollbar-track': {
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 999
        },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.12)',
          borderRadius: 999,
          border: '2px solid rgba(15, 23, 42, 0.8)',
          boxShadow: 'none'
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255, 255, 255, 0.18)'
        },
        '@keyframes hl-bg-shift': {
          from: { filter: 'hue-rotate(0deg) saturate(1) brightness(1)' },
          to: { filter: 'hue-rotate(14deg) saturate(1.08) brightness(1.03)' }
        },
        '@keyframes hl-aurora-mesh': {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)', opacity: 0.45 },
          '33%': { transform: 'rotate(120deg) scale(1.06)', opacity: 0.62 },
          '66%': { transform: 'rotate(240deg) scale(1.03)', opacity: 0.52 }
        },
        '@keyframes hl-row-in': {
          from: { opacity: 0, transform: 'translateY(6px)', filter: 'blur(6px)' },
          to: { opacity: 1, transform: 'translateY(0px)', filter: 'blur(0px)' }
        },
        '@keyframes hl-soft-pulse': {
          '0%': { boxShadow: '0 0 0 rgba(61,158,255,0)' },
          '50%': { boxShadow: '0 0 22px rgba(61,158,255,0.18)' },
          '100%': { boxShadow: '0 0 0 rgba(61,158,255,0)' }
        },
        '[data-hl-compact="1"] .MuiPaper-root': {
          borderRadius: 10
        },
        '[data-hl-compact="1"] .MuiDataGrid-toolbarContainer': {
          paddingTop: 6,
          paddingBottom: 6
        },
        '[data-hl-compact="1"] .MuiButton-root': {
          minHeight: 32
        },
        '[data-hl-motion="reduced"] *': {
          animationDuration: '0ms !important',
          transitionDuration: '0ms !important'
        },
        '[data-hl-motion="reduced"] body::after': {
          animation: 'none !important',
          opacity: 0.28
        },
        '.hl-settings-card': {
          transition: 'transform 160ms ease, box-shadow 220ms ease, border-color 200ms ease'
        },
        '.hl-settings-card:hover': {
          transform: 'translateY(-2px)',
          borderColor: 'rgba(61,158,255,0.35)',
          boxShadow:
            '0 10px 36px rgb(61 158 255 / calc(var(--hl-glow-strength, 0.65) * 0.22)), 0 0 0 1px rgba(61,158,255,0.10) inset'
        },
        '.hl-settings-card:focus-within': {
          animation: 'hl-soft-pulse 900ms ease-in-out 1'
        },
        '.hl-kanban-column': {
          transition: 'transform 140ms ease, border-color 160ms ease, box-shadow 180ms ease'
        },
        '.hl-kanban-column:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.22)'
        }
      }
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: false
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 11,
          transition: 'box-shadow 0.28s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.22s ease',
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(61, 158, 255, 0.22)'
          }
        },
        notchedOutline: {
          borderColor: 'rgba(148, 163, 184, 0.22)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          transition: 'all 0.3s ease-out',
          '&:hover': {
            boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
            transform: 'translateY(-1px)'
          },
          '&:active': { transform: 'translateY(0)' }
        },
        containedPrimary: {
          backgroundImage: 'linear-gradient(90deg, #312E81 0%, #6366F1 45%, #7C3AED 100%)',
          backgroundSize: '160% 160%',
          transition: 'all 0.3s ease-out',
          '&:hover': {
            backgroundPosition: '95% 50%',
            filter: 'brightness(1.06)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.38), 0 0 28px rgba(99, 102, 241, 0.22)'
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
            backgroundColor: 'rgba(255,255,255,0.06)'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          letterSpacing: 0.15,
          backdropFilter: 'blur(6px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        outlinedSuccess: {
          boxShadow: 'none'
        },
        outlinedWarning: {
          boxShadow: 'none'
        },
        outlinedError: {
          boxShadow: 'none'
        },
        outlinedInfo: {
          boxShadow: 'none'
        }
      }
    },
    MuiSkeleton: {
      defaultProps: {
        animation: 'wave'
      }
    },
    MuiDialog: {
      defaultProps: {
        TransitionComponent: Fade,
        transitionDuration: { enter: 220, exit: 160 }
      },
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(9, 9, 11, 0.92)',
          backgroundImage: 'linear-gradient(165deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 0 rgba(255,255,255,0.08)'
        }
      }
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(6, 10, 16, 0.62)'
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          transition:
            'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.22s ease, box-shadow 0.28s ease',
          '&:hover': { transform: 'translateY(-1px)' },
          '&.Mui-selected': {
            background:
              'linear-gradient(90deg, rgba(56, 189, 248, 0.14) 0%, rgba(167, 139, 250, 0.08) 45%, transparent 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.06)'
          },
          '&.Mui-selected:hover': {
            background:
              'linear-gradient(90deg, rgba(56, 189, 248, 0.2) 0%, rgba(167, 139, 250, 0.1) 50%, transparent 100%)'
          }
        }
      }
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(77, 166, 255, 0.14)',
          borderRadius: 14,
          overflow: 'hidden',
          '--DataGrid-overlayHeight': '240px',
          '& .MuiDataGrid-toolbarContainer': {
            gap: 8,
            padding: '10px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
            transition: 'background-color 160ms ease, backdrop-filter 160ms ease',
            backdropFilter: 'blur(6px)'
          },
          '& .MuiDataGrid-toolbarContainer .MuiButton-root': {
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)'
          },
          '& .MuiDataGrid-toolbarContainer .MuiFormControl-root': {
            transition: 'transform 140ms ease'
          },
          '& .MuiDataGrid-toolbarContainer .MuiFormControl-root:focus-within': {
            transform: 'translateY(-1px)'
          },
          '& .MuiDataGrid-toolbarContainer .MuiInputBase-root': {
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(6px)'
          },
          '& .MuiDataGrid-toolbarContainer .MuiButton-root:hover': {
            background: 'rgba(61, 158, 255, 0.16)',
            borderColor: 'rgba(61, 158, 255, 0.28)'
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700
          },
          '& .MuiDataGrid-row.Mui-selected': {
            backgroundColor: 'rgba(99, 102, 241, 0.16) !important'
          },
          '& .MuiDataGrid-row.Mui-selected:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.22) !important'
          }
        },
        columnHeaders: {
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        },
        row: {
          transition: 'background-color 140ms ease',
          animation: 'hl-row-in 240ms ease-out both',
          minHeight: 46,
          '&:hover': {
            backgroundColor: 'rgba(76, 29, 149, 0.12)'
          }
        },
        cell: {
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.25rem',
          '&:focus, &:focus-within': { outline: 'none' }
        },
        footerContainer: {
          borderTop: '1px solid rgba(255,255,255,0.08)'
        }
      }
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 8,
          paddingTop: 12,
          paddingBottom: 12,
          transition: 'all 0.3s ease-out'
        },
        rail: {
          opacity: 1,
          height: 8,
          borderRadius: 99,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
        },
        track: {
          height: 8,
          borderRadius: 99,
          border: 'none',
          background: 'linear-gradient(90deg, #00FFA3 0%, #6366F1 50%, #00E5FF 100%)',
          boxShadow: '0 0 14px rgba(99,102,241,0.2)'
        },
        thumb: {
          width: 20,
          height: 20,
          backgroundColor: '#ffffff',
          border: '2px solid rgba(11,9,20,0.9)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
          transition: 'all 0.3s ease-out',
          '&:hover, &.Mui-focusVisible, &.Mui-active': {
            boxShadow: '0 6px 20px rgba(0,0,0,0.5), 0 0 0 8px rgba(139,92,246,0.14)'
          }
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(11, 9, 20, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
          transition: 'opacity 0.2s ease, transform 0.2s ease'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#0B0914',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundImage:
            'linear-gradient(168deg, rgba(19, 15, 37, 0.55) 0%, rgba(11, 9, 20, 0.92) 48%, rgba(16, 12, 28, 0.88) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
          transition: 'all 0.3s ease-out',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.14)',
            transform: 'translateY(-2px)',
            filter: 'none',
            boxShadow:
              '0 14px 36px rgba(0,0,0,0.5), 0 0 28px rgba(76, 29, 149, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.09)'
          }
        }
      }
    }
  }
})

