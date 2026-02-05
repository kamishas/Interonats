import { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Type
} from 'lucide-react';
import { cn } from './ui/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Input } from './ui/input';
import { Label } from './ui/label';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [fontSize, setFontSize] = useState('14');
  const [fontFamily, setFontFamily] = useState('Arial');

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    updateContent();
  };

  const insertLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
      setLinkUrl('');
      setIsLinkPopoverOpen(false);
    }
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    execCommand('fontSize', '7'); // execCommand fontSize uses 1-7
    // Then we'll wrap it with a span with actual px size
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      range.surroundContents(span);
    }
    updateContent();
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    execCommand('fontName', family);
    updateContent();
  };

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  return (
    <div className={cn("border rounded-md overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
        {/* Font Size */}
        <Select value={fontSize} onValueChange={handleFontSizeChange}>
          <SelectTrigger className="w-[80px] h-8">
            <Type className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12px</SelectItem>
            <SelectItem value="14">14px</SelectItem>
            <SelectItem value="16">16px</SelectItem>
            <SelectItem value="18">18px</SelectItem>
            <SelectItem value="20">20px</SelectItem>
            <SelectItem value="24">24px</SelectItem>
            <SelectItem value="32">32px</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Font Family */}
        <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial" style={{ fontFamily: 'Arial' }}>Arial</SelectItem>
            <SelectItem value="Times New Roman" style={{ fontFamily: 'Times New Roman' }}>Times New Roman</SelectItem>
            <SelectItem value="Courier New" style={{ fontFamily: 'Courier New' }}>Courier New</SelectItem>
            <SelectItem value="Verdana" style={{ fontFamily: 'Verdana' }}>Verdana</SelectItem>
            <SelectItem value="Georgia" style={{ fontFamily: 'Georgia' }}>Georgia</SelectItem>
            <SelectItem value="Helvetica" style={{ fontFamily: 'Helvetica' }}>Helvetica</SelectItem>
            <SelectItem value="Palatino" style={{ fontFamily: 'Palatino' }}>Palatino</SelectItem>
            <SelectItem value="Trebuchet MS" style={{ fontFamily: 'Trebuchet MS' }}>Trebuchet MS</SelectItem>
            <SelectItem value="Garamond" style={{ fontFamily: 'Garamond' }}>Garamond</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Formatting */}
        <Button
          type="button"
          variant={isCommandActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isCommandActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isCommandActive('underline') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant={isCommandActive('justifyLeft') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('justifyLeft')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isCommandActive('justifyCenter') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('justifyCenter')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isCommandActive('justifyRight') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('justifyRight')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant={isCommandActive('insertUnorderedList') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isCommandActive('insertOrderedList') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Link */}
        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={isCommandActive('createLink') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              title="Insert Link"
            >
              <Link className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="link-url">Link URL</Label>
                <Input
                  id="link-url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      insertLink();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLinkUrl('');
                    setIsLinkPopoverOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={insertLink}
                  disabled={!linkUrl}
                >
                  Insert
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-3 focus:outline-none prose prose-sm max-w-none"
        onInput={handleInput}
        onBlur={updateContent}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
        }}
      />
    </div>
  );
}