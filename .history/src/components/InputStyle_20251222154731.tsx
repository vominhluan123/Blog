import React from 'react'

const InputStyle = () => {
  return (
    <Input
      placeholder='Tìm bài viết...'
      className='hidden md:block w-64 rounded-full bg-background/80 backdrop-blur-sm 
                 dark:bg-background/50 dark:border-primary/20 
                 focus:ring-primary/70 dark:focus:shadow-lg dark:focus:shadow-primary/30'
    />
  )
}

export default InputStyle