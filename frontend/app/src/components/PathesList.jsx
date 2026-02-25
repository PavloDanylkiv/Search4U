import PathTaken from './PathTaken.jsx'

export default function PathesList({ pathes }) {
  return (
    <tbody>
      {pathes.map((path) => (
        <PathTaken key={path.id} path={path} />
      ))}
    </tbody>
  )
}
