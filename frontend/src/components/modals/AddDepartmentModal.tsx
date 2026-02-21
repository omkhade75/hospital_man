import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateDepartment } from "@/hooks/useDepartments";

const departmentSchema = z.object({
    name: z.string().min(2, "Department name must be at least 2 characters"),
    head_doctor: z.string().optional(),
    total_beds: z.union([z.string(), z.number()]).optional().transform(v => v === "" ? undefined : Number(v)),
    doctors_count: z.union([z.string(), z.number()]).optional().transform(v => v === "" ? undefined : Number(v)),
    nurses_count: z.union([z.string(), z.number()]).optional().transform(v => v === "" ? undefined : Number(v)),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface AddDepartmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AddDepartmentModal = ({ open, onOpenChange }: AddDepartmentModalProps) => {
    const createDepartment = useCreateDepartment();

    const form = useForm<DepartmentFormData>({
        resolver: zodResolver(departmentSchema),
        defaultValues: {
            name: "",
            head_doctor: "",
            total_beds: "" as any,
            doctors_count: "" as any,
            nurses_count: "" as any,
        },
    });

    const onSubmit = async (data: DepartmentFormData) => {
        await createDepartment.mutateAsync({
            name: data.name,
            head_doctor: data.head_doctor || undefined,
            total_beds: data.total_beds || 0,
            doctors_count: data.doctors_count || 0,
            nurses_count: data.nurses_count || 0,
        });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) form.reset();
        }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-heading">Add New Department</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Cardiology" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="head_doctor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Head Doctor</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Dr. John Smith" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="total_beds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Beds</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="50" min="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="doctors_count"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Number of Doctors</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="10" min="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="nurses_count"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Nurses</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="30" min="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => {
                                form.reset();
                                onOpenChange(false);
                            }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createDepartment.isPending}>
                                {createDepartment.isPending ? "Adding..." : "Add Department"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AddDepartmentModal;
