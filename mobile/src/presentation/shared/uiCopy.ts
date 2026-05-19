export const uiCopy = {
  tabs: {
    profile: 'Perfil',
    watchlist: 'Pendientes',
    diary: 'Diario',
    social: 'Social',
  },
  sections: {
    favorites: 'Favoritas',
    recentActivity: 'Actividad reciente',
    socialActivity: 'Actividad social',
    visualRadar: 'Radar visual',
    detailedActivity: 'Actividad detallada',
    community: 'Comunidad',
  },
  actions: {
    searchUsers: 'Buscar usuarios',
    findUsers: 'Encontrar usuarios',
    openList: 'Abrir lista',
    viewDiary: 'Ver diario',
  },
  stats: {
    watched: 'Visionados',
    following: 'Siguiendo',
    followers: 'Seguidores',
  },
  labels: {
    titles: 'Titulos',
    featured: 'Seleccion destacada',
    pending: 'Pendiente',
    watched: 'Vista',
    noTmdbScore: 'Sin nota TMDB',
    unrated: 'Sin nota',
  },
  mediaType: {
    movie: 'Pelicula',
    tv: 'Serie',
  },
} as const;

export function getStatusLabel(status: 'watched' | 'watchlist') {
  return status === 'watched' ? uiCopy.labels.watched : uiCopy.labels.pending;
}
