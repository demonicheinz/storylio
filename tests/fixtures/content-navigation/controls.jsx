import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function Controls() {
  const [value, setValue] = useState("one");
  return (
    <main className="flex flex-col items-start gap-6 p-8">
      <Button>Enabled button</Button>
      <Button disabled>Disabled button</Button>
      <button type="button" aria-disabled="true">
        ARIA-disabled button
      </button>
      <button type="button" data-disabled>
        Data-disabled button
      </button>
      <select aria-label="Native select">
        <option>One</option>
      </select>
      <Checkbox aria-label="Enabled checkbox" />
      <Checkbox disabled aria-label="Disabled checkbox" />
      <Switch aria-label="Enabled switch" />
      <Switch disabled aria-label="Disabled switch" />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger aria-label="Select choice">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="one">One</SelectItem>
            <SelectItem value="two">Two</SelectItem>
            <SelectItem value="three" disabled>
              Disabled option
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select disabled value="one">
        <SelectTrigger aria-label="Disabled select">
          <SelectValue />
        </SelectTrigger>
      </Select>
      <output>{value}</output>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button />}>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>Menu action</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More actions</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Nested action</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </main>
  );
}
