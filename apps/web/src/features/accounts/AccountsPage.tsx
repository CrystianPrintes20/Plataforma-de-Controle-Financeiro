import { useAccounts, useCreateAccount, useDeleteAccount } from "@/features/accounts";
import { AppShell } from "@/app/AppShell";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Plus, CreditCard, Landmark, Banknote, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAccountSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertAccountSchema.extend({
  balance: z.coerce.number(),
  limit: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Accounts() {
  const { data: accounts, isLoading } = useAccounts();
  const { mutate: deleteAccount } = useDeleteAccount();

  const getIcon = (type: string) => {
    switch (type) {
      case 'credit': return <CreditCard className="h-6 w-6 text-white" />;
      case 'cash': return <Banknote className="h-6 w-6 text-white" />;
      default: return <Landmark className="h-6 w-6 text-white" />;
    }
  };

  const getGradient = (type: string) => {
    switch (type) {
      case 'credit': return 'bg-gradient-to-br from-purple-500 to-indigo-600';
      case 'cash': return 'bg-gradient-to-br from-emerald-400 to-emerald-600';
      default: return 'bg-gradient-to-br from-blue-500 to-blue-700';
    }
  };

  return (
    <AppShell>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Accounts</h1>
            <p className="text-muted-foreground">Track balances across all your accounts.</p>
          </div>
          <AddAccountModal />
        </div>

        {isLoading ? (
          <div>Loading accounts...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts?.map((account) => (
              <Card key={account.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50">
                <div className={`absolute top-0 left-0 w-1 h-full ${account.type === 'credit' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">{account.name}</CardTitle>
                  <div className={`p-2 rounded-lg shadow-md ${getGradient(account.type)}`}>
                    {getIcon(account.type)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-display mt-2">
                    ${Number(account.balance).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {account.type} Account
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end pt-0">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteAccount(account.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            <AddAccountModal trigger={
              <button className="h-full min-h-[180px] rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-4 transition-all group">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Plus className="h-6 w-6" />
                </div>
                <p className="font-medium text-muted-foreground group-hover:text-primary">Add New Account</p>
              </button>
            }/>
          </div>
        )}
    </AppShell>
  );
}

function AddAccountModal({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateAccount();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "checking" }
  });

  const onSubmit = (data: FormValues) => {
    mutate(
      {
        ...data,
        balance: data.balance?.toString(),
        limit: data.limit !== undefined ? data.limit.toString() : undefined,
      },
      {
      onSuccess: () => {
        setOpen(false);
        reset();
      }
    }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Add Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Account Name</Label>
            <Input placeholder="e.g. Chase Checking" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select onValueChange={(val) => setValue("type", val as any)} defaultValue="checking">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Initial Balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input type="number" step="0.01" className="pl-7" {...register("balance")} />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
