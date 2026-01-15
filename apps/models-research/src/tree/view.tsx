import { useUnit } from 'effector-react';
import { useState } from 'react';

/**
 * Recursive Tree View Component
 */
export function RecursiveTreeView({
  instance,
  path = '',
}: {
  instance: any;
  path?: string;
}) {
  // We need to determine if it's a File or Folder.
  // We can check for the existence of the 'folder' facet.
  const isFolder = !!instance.facets.folder;

  if (isFolder) {
    return <FolderView instance={instance} path={path} />;
  }
  return <FileView instance={instance} path={path} />;
}

function FileView({ instance, path }: { instance: any; path: string }) {
  const [name, bgColor, select, rename] = useUnit([
    instance.facets.node.$name,
    instance.facets.visual.$backgroundColor,
    instance.facets.node.select,
    instance.facets.node.rename,
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const fullPath = path ? `${path} > ${name}` : name;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(name);
    (select as any)();
  };

  const handleSave = () => {
    (rename as any)(editName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(name);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center p-2 rounded bg-white shadow-sm border border-indigo-200">
        <span className="mr-2 text-gray-400">📄</span>
        <input
          autoFocus
          value={editName as string}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-full outline-none text-gray-700 bg-transparent"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => (select as any)()}
      onDoubleClick={handleDoubleClick}
      className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors group"
      style={{ backgroundColor: bgColor as any }}
    >
      <span className="mr-2 text-gray-400">📄</span>
      <span className="text-gray-700">{name as any}</span>
    </div>
  );
}

function FolderView({ instance, path }: { instance: any; path: string }) {
  const [name, isOpen, toggle, children] = useUnit([
    instance.facets.node.$name,
    instance.facets.folder.$isOpen,
    instance.facets.folder.toggle,
    instance.facets.folder.children,
  ]);

  // For visual facet
  const bgColor = useUnit(instance.facets.visual.$backgroundColor);
  const select = useUnit(instance.facets.node.select);
  const rename = useUnit(instance.facets.node.rename);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const fullPath = path ? `${path} > ${name}` : name;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(name);
    (select as any)();
  };

  const handleSave = () => {
    (rename as any)(editName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(name);
    }
  };

  return (
    <div className="select-none">
      {isEditing ? (
        <div className="flex items-center p-2 rounded bg-white shadow-sm border border-indigo-200">
          <span className="mr-2 text-yellow-500">📁</span>
          <input
            autoFocus
            value={editName as string}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full outline-none text-gray-800 font-medium bg-transparent"
          />
        </div>
      ) : (
        <div
          onClick={(e) => {
            e.stopPropagation();
            (select as any)();
          }}
          onDoubleClick={handleDoubleClick}
          className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ backgroundColor: bgColor as any }}
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
              (toggle as any)();
            }}
            className="mr-2 text-gray-500 transform transition-transform duration-200 hover:text-gray-700 p-1"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▶
          </span>
          <span className="mr-2 text-yellow-500">📁</span>
          <span className="font-medium text-gray-800">{name as any}</span>
        </div>
      )}

      {Boolean(isOpen) && (
        <div className="ml-6 pl-2 border-l border-gray-200">
          {(children as any).map((child: any, i: number) => (
            <RecursiveTreeView
              key={i}
              instance={child}
              path={fullPath as string}
            />
          ))}
        </div>
      )}
    </div>
  );
}
