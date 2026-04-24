from fastapi import APIRouter, Depends
from schemas.category import Category, CategoryCreate
from services.CategoryService import CategoryManager
from controllers.authController import get_db, get_current_user_id
from sqlalchemy.orm import Session

router = APIRouter(prefix="/category", tags=["Categories"])

@router.post("/post", response_model=Category)
def create_category(category_data: CategoryCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = CategoryManager(db)
    return manager.create_category(user_id, category_data)

@router.get("/get", response_model=list[Category])
def get_categories(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = CategoryManager(db)
    return manager.get_categories_by_user(user_id)

@router.delete("/delete/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = CategoryManager(db)
    return manager.delete_category(user_id, category_id)
