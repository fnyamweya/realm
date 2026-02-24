'use client';

import { useForm, zodResolver, FormProvider, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@realtyos/forms';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@realtyos/ui';
import { z } from 'zod';

const maintenanceSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  priority: z.string().min(1, 'Please select a priority'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(1, 'Please enter a location'),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export default function NewMaintenanceRequestPage() {
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      category: '',
      priority: '',
      description: '',
      location: '',
    },
  });

  function onSubmit(_data: MaintenanceFormValues) {
    // Submit maintenance request
  }

  return (
    <PageContainer>
      <PageHeader
        title="New Maintenance Request"
        description="Submit a new maintenance request for your unit."
      />
      <Card>
        <CardContent className="pt-6">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="hvac">HVAC</SelectItem>
                          <SelectItem value="appliance">Appliance</SelectItem>
                          <SelectItem value="structural">Structural</SelectItem>
                          <SelectItem value="pest">Pest Control</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Cosmetic or minor issue</SelectItem>
                          <SelectItem value="medium">Medium - Functional but needs attention</SelectItem>
                          <SelectItem value="high">High - Urgent, affects daily living</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Kitchen, Bathroom, Living Room"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Please describe the issue in detail..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Submit Request</Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
