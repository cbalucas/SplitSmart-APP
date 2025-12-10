// Componentes reutilizables base para SplitSmart
export { default as HeaderBar } from './HeaderBar';
export { default as Input } from './Input';
export { default as Card } from './Card';
export { default as Avatar } from './Avatar';
export { default as ListItem } from './ListItem';
export { default as Button } from './Button';
export { default as EventCard } from './EventCard';
export { default as MetricsCard } from './MetricsCard';
export { default as SearchBar } from './SearchBar';
export { default as AddParticipantModal } from './AddParticipantModal';
export { LanguageSelector } from './LanguageSelector';
export { CurrencySelector } from './CurrencySelector';
export { ThemeToggle } from './ThemeToggle';
export { UserAvatar } from './UserAvatar';
export { SettlementItem } from './SettlementItem';

// Re-exportar solo los tipos que no dan problemas
export type { HeaderBarProps } from './HeaderBar';
export type { InputProps } from './Input';
export type { AvatarProps } from './Avatar';
export type { ListItemProps } from './ListItem';
export type { ButtonProps } from './Button';
export type { EventCardProps, EventData } from './EventCard';
export type { MetricsCardProps, MetricData } from './MetricsCard';

// CardProps se importará directamente donde se necesite