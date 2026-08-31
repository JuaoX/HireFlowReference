export interface PermissionPreset {
  id: string;
  name: string;
  description: string;
  permissions: {
    can_view: boolean;
    can_move_pipeline: boolean;
    can_message: boolean;
    can_view_offer: boolean;
  };
}

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Can only view applications and candidates',
    permissions: {
      can_view: true,
      can_move_pipeline: false,
      can_message: false,
      can_view_offer: false,
    },
  },
  {
    id: 'interviewer',
    name: 'Interviewer',
    description: 'Can view and communicate with candidates',
    permissions: {
      can_view: true,
      can_move_pipeline: false,
      can_message: true,
      can_view_offer: false,
    },
  },
  {
    id: 'recruiter',
    name: 'Recruiter',
    description: 'Can manage pipeline and communicate',
    permissions: {
      can_view: true,
      can_move_pipeline: true,
      can_message: true,
      can_view_offer: false,
    },
  },
  {
    id: 'hiring_manager',
    name: 'Hiring Manager',
    description: 'Full access including offers',
    permissions: {
      can_view: true,
      can_move_pipeline: true,
      can_message: true,
      can_view_offer: true,
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Define custom permissions',
    permissions: {
      can_view: true,
      can_move_pipeline: false,
      can_message: false,
      can_view_offer: false,
    },
  },
];

export function getPresetById(id: string): PermissionPreset | undefined {
  return PERMISSION_PRESETS.find((preset) => preset.id === id);
}

export function detectPresetFromPermissions(permissions: {
  can_view: boolean;
  can_move_pipeline: boolean;
  can_message: boolean;
  can_view_offer: boolean;
}): string {
  for (const preset of PERMISSION_PRESETS) {
    if (preset.id === 'custom') continue;
    
    if (
      preset.permissions.can_view === permissions.can_view &&
      preset.permissions.can_move_pipeline === permissions.can_move_pipeline &&
      preset.permissions.can_message === permissions.can_message &&
      preset.permissions.can_view_offer === permissions.can_view_offer
    ) {
      return preset.id;
    }
  }
  
  return 'custom';
}
