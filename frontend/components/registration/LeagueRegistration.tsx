import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from 'shadcn/ui/input';
import { Button } from 'shadcn/ui/button';
import { toast } from 'shadcn/ui/toast';

const RegistrationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  resident: z.boolean(),
});
type RegistrationFormValues = z.infer<typeof RegistrationSchema>;

const LeagueRegistration: React.FC<{ leagueName?: string }> = ({ leagueName = 'Spring Soccer' }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormValues>({
    resolver: zodResolver(RegistrationSchema),
  });
  return (
    <div className="w-full" role="region" aria-label="League registration" tabIndex={0}>
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Register for {leagueName}</h2>
        <form
          className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-lg"
          onSubmit={handleSubmit(data => toast.success('Registration submitted!'))}
          aria-label="League registration form"
        >
          <div>
            <label className="block font-medium mb-1">Name</label>
            <Input {...register('name')} aria-invalid={!!errors.name} />
            {errors.name && <span className="text-red-600 text-xs">{errors.name.message}</span>}
          </div>
          <div>
            <label className="block font-medium mb-1">Email</label>
            <Input {...register('email')} aria-invalid={!!errors.email} />
            {errors.email && <span className="text-red-600 text-xs">{errors.email.message}</span>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('resident')} id="resident" />
            <label htmlFor="resident">I am a Cary resident</label>
          </div>
          <Button type="submit" className="rounded-xl w-full">Submit Registration</Button>
        </form>
      </div>
    </div>
  );
};

export default LeagueRegistration; 