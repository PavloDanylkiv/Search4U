import React from "react"

export default function PathTaken({ path }) {
    return (
        <tr>
            <td className="path-cell"><span className="cell-icon">◎</span>{path.name}</td>
            <td>{path.date}</td>
            <td>{path.time} min</td>
            <td>${path.budget}</td>
            <td><span className="status-badge planned">{'★'.repeat(path.review)}{'☆'.repeat(5 - path.review)}</span></td>
            <td className="comment-cell">{path.comment}</td>
        </tr>
    )
}
