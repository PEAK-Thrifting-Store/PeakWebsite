export interface Post {
  id: number
  rail_id: number | null
  title: string | null
  instagram_url: string
  image_url: string
  image_version: number
  sort_order: number
  is_visible: boolean
  created_at: string
}

export interface Rail {
  id: number
  name: string
  sort_order: number
  created_at: string
  posts?: Post[]
}

export interface Message {
  id: number
  name: string
  contact: string
  message: string
  is_read: boolean
  created_at: string
}

export type ClosetState = 'idle' | 'opening' | 'open' | 'closing'
