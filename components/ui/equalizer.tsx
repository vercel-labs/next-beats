import { cn } from '@/lib/utils';

export function Equalizer({ size = 'sm', color = 'bg-accent' }: { size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const gapClass = size === 'lg' ? 'gap-1' : size === 'md' ? 'gap-[3px]' : 'gap-0.5';
  return (
    <span className={cn('flex h-4 items-end justify-center', gapClass)}>
      <span className={cn('inline-block w-0.75 animate-[eq1_0.8s_ease-in-out_infinite] rounded-sm', color)} />
      <span className={cn('inline-block w-0.75 animate-[eq2_0.6s_ease-in-out_infinite_0.2s] rounded-sm', color)} />
      <span className={cn('inline-block w-0.75 animate-[eq3_0.7s_ease-in-out_infinite_0.1s] rounded-sm', color)} />
    </span>
  );
}
