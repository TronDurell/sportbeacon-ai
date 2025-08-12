import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useVenues() {
  const { data, error } = useSWR('/api/venues', fetcher)
  return {
    venues: data,
    isLoading: !error && !data,
    isError: error
  }
}

export function useDrillSuggestions(playerId: string, venueType?: string) {
  const { data, error } = useSWR(`/api/drills?playerId=${playerId}&venueType=${venueType}`, fetcher)
  const filteredDrills = data?.filter(drill => {
    if (venueType === 'trail') {
      return !drill.tags.includes('water')
    }
    return true
  })
  return {
    drills: filteredDrills,
    isLoading: !error && !data,
    isError: error
  }
} 