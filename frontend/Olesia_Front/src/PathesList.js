import React from 'react'
import PathTaken from './PathTaken'

export default function PathesList({pathes}) {
    return (
        pathes.map(path => {
            return <PathTaken path = {path} />
        })
    )
}
