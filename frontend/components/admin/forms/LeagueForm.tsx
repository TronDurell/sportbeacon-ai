import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from 'shadcn/ui/input';
import { Button } from 'shadcn/ui/button';
import { toast } from 'shadcn/ui/toast';

const LeagueSchema = z.object({
  name: z.string().min(2),
  season: z.string().min(2),
  paymentTier: z.string().min(1),
});
type LeagueFormValues = z.infer<typeof LeagueSchema>;

const LeagueForm: React.FC<{ onSubmit: (data: LeagueFormValues) => void }> = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LeagueFormValues>({
    resolver: zodResolver(LeagueSchema),
  });
  return (
    <form className="w-full" role="form" aria-label="League form" tabIndex={0}>
      <div>
        <label className="block font-medium mb-1">League Name</label>
        <Input {...register('name')} aria-invalid={!!errors.name} />
        {errors.name && <span className="text-red-600 text-xs">{errors.name.message}</span>}
      </div>
      <div>
        <label className="block font-medium mb-1">Season</label>
        <Input {...register('season')} aria-invalid={!!errors.season} />
        {errors.season && <span className="text-red-600 text-xs">{errors.season.message}</span>}
      </div>
      <div>
        <label className="block font-medium mb-1">Payment Tier</label>
        <Input {...register('paymentTier')} aria-invalid={!!errors.paymentTier} />
        {errors.paymentTier && <span className="text-red-600 text-xs">{errors.paymentTier.message}</span>}
      </div>
      <Button type="submit" className="rounded-xl w-full">Save League</Button>
    </form>
  );
};

export default LeagueForm; 